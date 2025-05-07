AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 506094621672
AWS_PROFILE ?= ergi

REJUVE_PROD ?= Rejuve-BE
REJUVE_STAGING ?= Rejuve-BE-staging
KEY_PAIR_NAME ?= rejuve-keypair
STAGING_KEY_PAIR_NAME ?= rejuve-keypair


deploy-prod:
	@sam deploy \
		--stack-name $(REJUVE_PROD) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file template.yaml \
		--parameter-overrides \
			OperatorEmail=ergi@roi.ad \
			KeyPairName=$(KEY_PAIR_NAME) \
		--tags \
			project=rejuve-be \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

deploy-staging:
	@sam deploy \
		--stack-name $(REJUVE_STAGING) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file be-template.yaml \
		--parameter-overrides \
			OperatorEmail=ergi@roi.ad \
			RDSPostgresClusterPassword=developer123 \
			KeyPairName=$(STAGING_KEY_PAIR_NAME) \
		--tags \
			project=rejuve-be \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

destroy-prod:
	@sam delete \
		--stack-name $(REJUVE_PROD) \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

destroy-staging:
	@sam delete \
		--stack-name $(REJUVE_STAGING) \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

