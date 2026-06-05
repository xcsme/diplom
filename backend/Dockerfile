FROM python:3.11-slim AS backend

WORKDIR /app

COPY requirements.prod.txt server.py ./
RUN pip install --no-cache-dir -r requirements.prod.txt && \
    rm -rf /root/.cache/pip && \
    rm requirements.prod.txt

EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
