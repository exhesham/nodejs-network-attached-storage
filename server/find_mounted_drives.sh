#!/bin/bash

echo "[";

for usb in $1/*
do

	mount |grep -v "/dev/mmcblk" | grep $usb  &>/dev/null
#echo "current $usb and path is $1"
	if [[ $? -eq 0 ]]; then
		#THE USB IS IN MOUNT
		echo `df -h $usb | grep -v Size |awk '{print "{\"size\":\""$2,"\",\"used\":\""$3,"\",\"free\":\""$4,"\",\"used_prcntg\":\""$5"\",\"mounted_dir\":\""$6"\"},"}' `
		
	fi
done
echo "{}]"
