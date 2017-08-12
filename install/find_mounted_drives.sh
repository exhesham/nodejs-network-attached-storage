#!/bin/bash
set user
u="$USER"
echo "["
for usb in /media/$u/*
do
	mount |grep -v "/dev/mmcblk" | grep $usb  &>/dev/null
	if [[ $? -eq 0 ]]; then
		#THE USB IS IN MOUNT
		echo "`df -h $usb | grep -v Size |awk '{print "{\"size\":\""$2,"\",\"used\":\""$3,"\",\"free\":\""$4,"\",\"used_prcntg\":\""$5"\",\"mounted_dir\":\""$6"\"},"}' `"
		
	fi
done
echo "{}]"
