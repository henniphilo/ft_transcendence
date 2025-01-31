

## What is Redis?
Redis (Remote Dictionary Server) is an open-source, in-memory data structure store used as:
- Database
- Cache
- Message broker
- Real-time data store

Key Features:
- Extremely fast (in-memory access)
- Supports various data structures (strings, hashes, lists, sets)
- Persistence options
- Pub/Sub messaging pattern

## Redis in this Project
### Check if Redis is running:

**`docker-compose exec redis redis-cli`** 

```bash
127.0.0.1:6379> ping
PONG
```

