# about docker

if the cocker file copies files into the container when building it is not enough to rebuild when editing the files... the image needs to be removed and rebuilt, like this

first remove the image
```bash
docker compose down
docker rmi backend
```

then rebuild the image

```bash
docker compose up -d --force-recreate backend
```

## so many names tags and hashes. where are the images?

```bash
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}"
```
