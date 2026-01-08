# PostgreSQL Initialization Scripts

This directory contains initialization scripts that are executed when
the PostgreSQL container is first created.

Scripts are executed in alphabetical order.

## Example scripts:

- `01-extensions.sql` - Enable PostgreSQL extensions
- `02-grants.sql` - Set up permissions

## Note

These scripts only run when the database volume is first created.
To re-run them, delete the `postgres_data` volume:

```bash
docker compose down -v
docker compose up -d
```
