import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SolanaPokerStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneName: string;
  googleClientId?: string;
}

export class SolanaPokerStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: SolanaPokerStackProps) {
    super(scope, id, props);

    // ========================================
    // 1. S3 Bucket for Static Website Hosting
    // ========================================
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${props.domainName.replace(/\./g, '-')}-website`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      publicReadAccess: false, // CloudFront will access via OAI
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep bucket on stack deletion
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // ========================================
    // 2. CloudFront Origin Access Identity
    // ========================================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for ${props.domainName}`,
      }
    );

    // Grant CloudFront read access to the bucket
    this.bucket.grantRead(originAccessIdentity);

    // ========================================
    // 3. ACM Certificate for HTTPS
    // ========================================
    // Look up the hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.hostedZoneName,
    });

    // Create certificate in us-east-1 (required for CloudFront)
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ========================================
    // 4. CloudFront Distribution
    // ========================================
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [props.domainName],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
    });

    // ========================================
    // 5. Route53 DNS Record
    // ========================================
    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
    });

    // ========================================
    // 6. Cognito User Pool (for user management)
    // ========================================
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'solana-poker-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // User Pool Client
    const userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: 'solana-poker-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${props.domainName}`,
          `https://${props.domainName}/callback`,
          'http://localhost:3000',
          'http://localhost:3000/callback',
        ],
        logoutUrls: [
          `https://${props.domainName}`,
          'http://localhost:3000',
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // Add Google Identity Provider if client ID is provided
    if (props.googleClientId) {
      const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
        this,
        'GoogleProvider',
        {
          clientId: props.googleClientId,
          clientSecretValue: cdk.SecretValue.secretsManager('google-client-secret', {
            jsonField: 'client_secret',
          }),
          userPool: this.userPool,
          scopes: ['profile', 'email', 'openid'],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          },
        }
      );

      // Ensure the provider is created before the client
      userPoolClient.node.addDependency(googleProvider);
    }

    // Cognito Domain for hosted UI
    const userPoolDomain = this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `solana-poker-${this.account}`,
      },
    });

    // ========================================
    // 7. Cognito Identity Pool (L2 Construct)
    // ========================================
    // Create authenticated role
    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': '${IdentityPoolId}',
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      description: 'Role for authenticated users',
    });

    // Add permissions for authenticated users
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-identity:GetId',
          'cognito-identity:GetCredentialsForIdentity',
        ],
        resources: ['*'],
      })
    );

    // Create unauthenticated role
    const unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': '${IdentityPoolId}',
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      description: 'Role for unauthenticated users',
    });

    // Create Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'solana-poker-identity-pool',
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
      supportedLoginProviders: props.googleClientId
        ? {
            'accounts.google.com': props.googleClientId,
          }
        : undefined,
    });

    // Attach roles to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });

    // Update role trust policies with actual identity pool ID
    const identityPoolId = this.identityPool.ref;
    authenticatedRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.FederatedPrincipal('cognito-identity.amazonaws.com')],
        actions: ['sts:AssumeRoleWithWebIdentity'],
        conditions: {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPoolId,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
      })
    );

    unauthenticatedRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.FederatedPrincipal('cognito-identity.amazonaws.com')],
        actions: ['sts:AssumeRoleWithWebIdentity'],
        conditions: {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPoolId,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
      })
    );

    // ========================================
    // 8. Outputs
    // ========================================
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: 'SolanaPokerBucketName',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: 'SolanaPokerDistributionId',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${props.domainName}`,
      description: 'Website URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'SolanaPokerUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'SolanaPokerUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: 'SolanaPokerIdentityPoolId',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito Hosted UI Domain',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'SolanaPokerRegion',
    });
  }
}
