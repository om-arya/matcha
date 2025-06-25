FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 80

CMD ["uvicorn", "summary_service:app", "--host", "0.0.0.0", "--port", "80"]

# How to deploy on AWS ECR:

# 1.
# aws configure

# 2.
# aws ecr get-login-password --region us-east-1 | \
# docker login --username AWS --password-stdin 891377042509.dkr.ecr.us-east-1.amazonaws.com

# 3.
# docker build -t summary-service .
# docker tag summary-service:latest 891377042509.dkr.ecr.us-east-1.amazonaws.com/summary-service:latest

# 4.
# docker push 891377042509.dkr.ecr.us-east-1.amazonaws.com/summary-service:latest