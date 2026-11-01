@echo off
title صفقات ذكية - تطبيق سطح المكتب
echo جاري تشغيل صفقات ذكية كتطبيق مستقل على سطح المكتب...
start msedge --app=http://localhost:5173/ 2>nul || start chrome --app=http://localhost:5173/ 2>nul || start http://localhost:5173/
exit
