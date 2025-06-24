FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 80

CMD ["uvicorn", "summary_api:app", "--host", "0.0.0.0", "--port", "80"]

# How to deploy on AWS ECR:
# 1.
# aws ecr create-repository --repository-name summary-api --region us-east-1
# Take note of the output, especially the repository URI (e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com/summary-api).

# 2.
# aws ecr get-login-password --region us-east-1 | \
# docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
# Replace 123456789012 and region with our actual AWS account ID and region.

# 3.
# docker build -t summary-api .
# docker tag summary-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/summary-api:latest

# 4.
# docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/summary-api:latest