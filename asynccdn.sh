cd /home/wxnet2013/build
cd ../cdnjs
git pull
lftp -c "set ftp:list-options -a;
open -u sys_upload/cdnjscn,Aj17bo-qkwe_1o? -p 21 v0.ftp.upyun.com; 
lcd /home/wxnet2013/cdnjs/ajax/libs/;
cd /libs;
mirror --reverse --only-newer --only-missing --delete --use-cache --verbose --parallel=2 --exclude-glob .git --exclude-glob .DS_Store"