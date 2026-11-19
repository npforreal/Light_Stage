# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).
> **Quy tắc chung cho mọi đợt lớn:** trước khi đóng đợt phải có một giai đoạn "Test như người dùng thật" bằng built-in browser (nhẹ, không cần build Tauri), chạy theo `docs/USER_TEST_SCRIPT.md`. Lỗi tìm được ghi vào PLAN.md (đợt hiện tại nếu chặn đóng đợt, ngược lại đợt kế). Không đánh `[x]` đóng đợt khi còn lỗi mức Critical/High.

## Đợt 13: Sửa Stage 3D sau Review (số liệu, bớt rối, preset camera)

> Nguồn: review 2026-11-19 trên browser thật (960×600, show trống "Untitled Show"). check.sh pass nhưng 4 lỗi dưới đây chỉ thấy khi chạy thật. Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình.

### Phát hiện
- [C] **Hai nguồn sự thật.** Header `LX: 12`, bộ đếm `Nhập 0 · Hiển thị 0`, 3D vẽ ~20 chùm tia trên show trống. Phải xác định 3D đang vẽ rig mặc định hay cue, và thống nhất một con số.
- [H] **Vẫn rối mắt.** Chùm nón chồng nhau thành khối sáng xanh, Top-Down khó phân biệt từng đèn (mục tiêu gốc của đợt 12 chưa đạt).
- [M] **Nút preset lệch.** Bấm Top-Down, camera đổi nhưng nút vẫn sáng FOH.
- [H] **12.6 tick sớm:** thiếu ảnh 3 preset, thiếu `tauri build`, CSP chưa kiểm trên bản Tauri thật.

- [x] 13.1 [C] Một nguồn số lượng: Rundown, header, bộ đếm, HUD và số khối 3D cùng đọc `fixtureModel`/rig; show trống ⇒ 0 đèn (hoặc ghi rõ "Rig mặc định N"). Test: nhập `Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4` ⇒ mọi nơi hiện 30 và 3D có đúng 30 thân đèn.
- [x] 13.2 [H] Giảm rối: chùm nón mảnh hơn, độ đục thấp, không additive chồng thành khối; mặc định chỉ hiện chùm của cue active + đèn đang chọn, nút "Hiện tất cả chùm"; thân đèn phân biệt loại bằng hình khối/màu nhãn, đánh số gần đèn khi chọn.
- [x] 13.3 [H] Top-Down/FOH/Backstage đọc rõ: khung nhìn tự fit sân khấu, ẩn chùm ở Top-Down hoặc vẽ thành vòng chiếu mảnh trên sàn.
- [x] 13.4 [M] Đồng bộ trạng thái nút preset với camera (kể cả sau khi xoay tay: nút về trạng thái "Tự do"); có test.
- [x] 13.5 [H] Xác minh thật (thay 12.6): ảnh chụp browser 3 preset × 960/1280/1920px lưu `scratch/`; `npx tauri build --debug --bundles app` và mở app; kiểm CSP trong bản Tauri; ghi kết quả vào PROGRESS. *(Đã có 9 ảnh + build/mở app; ảnh pixel cửa sổ native bị TCC chặn — ghi caveat trong PROGRESS.)*
- [x] 13.6 Đóng đợt: `check.sh --fast`, ghi PROGRESS, `archive_logs.py`; tick lại 12.6.
