FROM python:3.12-slim

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_USER=user

CMD ["sh", "entrypoint.sh"]
