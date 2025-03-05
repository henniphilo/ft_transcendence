## Postresql logs

This was a bit of a pain to set up correctly. The postgres has its conf file in a default location which is `/var/lib/postgresql/data` but if I want to add my own conf file I need to add a copy in `/etc/postgresql/`. 

I copied manually the log template and edited the 4 lines that were relevant to me. 

```bash
#------------------------------------------------------------------------------
# REPORTING AND LOGGING
#------------------------------------------------------------------------------

# - Where to Log -

log_destination = 'stderr,csvlog'		# Valid values are combinations of
					# stderr, csvlog, jsonlog, syslog, and
					# eventlog, depending on platform.
					# csvlog and jsonlog require
					# logging_collector to be on.

# This is used when logging to stderr:
logging_collector = on		# Enable capturing of stderr, jsonlog,
					# and csvlog into log files. Required
					# to be on for csvlogs and jsonlogs.
					# (change requires restart)

# These are only used if logging_collector is on:
log_directory = '/var/log/postgresql'		# directory where log files are written,
					# can be absolute or relative to PGDATA
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
```

My docker-compose file looks like this:

```yaml


## links

https://betterstack.com/community/guides/logging/how-to-start-logging-with-postgresql/#setting-up-a-sample-database

https://www.postgresql.org/docs/current/runtime-config-logging.html
