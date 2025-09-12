# Re-enable 8dot3 name creation on C: drive
fsutil 8dot3name set c: 0

# Re-enable 8dot3 name creation globally on new volumes
fsutil behavior set disable8dot3 0

# Re-enable last access updates
fsutil behavior set disablelastaccess 0
