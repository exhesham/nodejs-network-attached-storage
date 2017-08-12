#!/bin/bash
for usb in $1/*
do
	mount | grep $usb  &>/dev/null
	if [[ $? -eq 0 ]]; then
		#THE USB IS IN MOUNT
		find $usb  -ls -exec md5sum {} 2>/dev/null \; 
	fi
done
