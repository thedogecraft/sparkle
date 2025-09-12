# Disable 8dot3 name creation on C: drive
fsutil 8dot3name set c: 1

# Strip existing 8dot3 names on C: (be careful – this is irreversible)
fsutil 8dot3name strip /f /s /v c:

# Disable 8dot3 name creation globally on new volumes
fsutil behavior set disable8dot3 1

# Disable last access updates for file timestamps
fsutil behavior set disablelastaccess 1
