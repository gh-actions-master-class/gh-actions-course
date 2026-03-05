FROM python:alpine3.19

RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev \
    linux-headers
    
WORKDIR /app

COPY requirements.txt .

RUN python -V
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "/app/main.py"]
