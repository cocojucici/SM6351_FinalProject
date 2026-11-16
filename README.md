# SM6351_FinalProject

- [專案設計規範](design/DESIGN-STANDARD.md)：色彩、字體、電腦／手機字級與實作約定。
- [字體參考圖](design/reference/typography.png)
- [互動時間軸說明](ten-years/README.md)
- [開啟頁面](ten-years/dist/index.html)

## GitHub Pages 部署

首次部署前，在 GitHub 儲存庫的 **Settings → Pages** 將 **Source** 設為 **GitHub Actions**，並將 `.github/workflows/deploy-pages.yml` 和 `ten-years/dist/` 一起提交並推送到 `main`。

之後每次推送到 `main` 都會自動發佈 `ten-years/dist/`。也可以在 **Actions → Deploy to GitHub Pages** 選擇 `main` 手動執行，部署完成後可在執行記錄中開啟網站。
