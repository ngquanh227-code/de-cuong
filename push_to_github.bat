@echo off
chcp 65001 >nul
echo ========================================================
echo        CUONEDU PRO - ĐẨY CODE LÊN GITHUB
echo ========================================================
echo.
git add .
git commit -m "Update CuonEdu Pro code: %date% %time%"
git branch -M main
echo Dang day code len GitHub...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo [OK] Day code len GitHub thanh cong!
) else (
    echo [LOI] Khong the day code. Hay kiem tra ban da tao repository 'de-cuong' tren GitHub chua.
)
echo.
pause
