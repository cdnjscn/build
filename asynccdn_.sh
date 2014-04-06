cd /local/path
git pull
lftp -c "set ftp:list-options -a;
open -u user,password -p 21 ip; 
lcd /local/path/cdnjs/ajax/libs/;
cd /libs;
mirror --reverse --only-newer --only-missing --delete --use-cache --verbose --parallel=2 --exclude-glob .git --exclude-glob .DS_Store"