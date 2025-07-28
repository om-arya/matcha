FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install -r requirements.txt

COPY . ${LAMBDA_TASK_ROOT}

CMD ["gemini_api_key_service.handler"]

# How to redeploy on AWS Lambda:

# 1.
# aws configure

# 2.
# aws ecr get-login-password --region us-east-1 | \
# docker login --username AWS --password-stdin 891377042509.dkr.ecr.us-east-1.amazonaws.com

# 3.
# docker build --platform linux/amd64 -t gemini_api_key_service .
# docker tag gemini_api_key_service:latest 891377042509.dkr.ecr.us-east-1.amazonaws.com/gemini_api_key_service:latest

# 4.
# docker push 891377042509.dkr.ecr.us-east-1.amazonaws.com/gemini_api_key_service:latest

# 5.
# aws lambda update-function-code --function-name fastapi-handler --image-uri 891377042509.dkr.ecr.us-east-1.amazonaws.com/gemini_api_key_service:latest

# Test via:
# aws lambda invoke --function-name fastapi-handler --cli-binary-format raw-in-base64-out --payload file://test/event.json test/response.json

# Get the URL via:
# aws apigatewayv2 get-apis