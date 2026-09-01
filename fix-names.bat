@echo off
echo Fixing Next.js folder names for Windows...
for /d /r %%x in (_id_) do ren "%%x" "[id]" 2>nul
for /d /r %%x in (_dashboard_) do ren "%%x" "(dashboard)" 2>nul
for /d /r %%x in (_auth_) do ren "%%x" "(auth)" 2>nul
echo Done! Now you can npm install
pause
