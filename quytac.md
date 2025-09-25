# QUY TẮC & CHECKLIST DÀNH CHO AI KHI TẠO CHỨC NĂNG MỚI

Tài liệu này quy định nguyên tắc, quy trình và checklist bắt buộc AI phải tuân theo trước khi thêm/chỉnh sửa tính năng trong dự án Chatbot (NestJS + Angular + MongoDB Atlas).

## 1) Bối cảnh kỹ thuật
- Backend: NestJS 10, TypeScript, Mongoose 7, class-validator, Swagger.
- Frontend: Angular 17, Angular Material, Reactive Forms.
- Database: MongoDB Atlas (URL lấy từ biến môi trường `MONGODB_URI`).
- Cổng mặc định:
  - Backend: http://localhost:3000
  - Frontend: http://localhost:4201 (CORS đã allow 4200/4201)
- UI: Sử dụng Material, bundle modules qua `MaterialModule` (không import lẻ tẻ trong component).

## 2) Nguyên tắc chung
- Tối thiểu thay đổi: Sửa đúng nơi cần, không refactor lan man, không đổi style/format toàn dự án.
- Tách bạch backend/frontend, đặt file đúng cấu trúc thư mục hiện có.
- Tên đường dẫn REST theo kebab-case, số nhiều: `/users`, `/product-groups`, `/fanpages`, ...
- Dùng DTO + `class-validator` cho mọi payload vào; Schema Mongoose xác định `required`, `enum`, `default`, `unique`, `index` rõ ràng.
- Trường kiểu ngày/giờ: Frontend gửi ISO string; Service backend chuyển sang `Date` trước khi lưu DB.
- Xử lý lỗi nhất quán:
  - Trùng khóa (Mongo 11000): trả `BadRequestException` với thông điệp dễ hiểu.
  - Không tìm thấy: `NotFoundException`.
- Bảo mật: Không log access token/secret ra console; không hardcode thông tin nhạy cảm. Đưa vào `.env`/biến môi trường nếu cần.
- Swagger: Tự động được bật; thêm module mới sẽ tự hiển thị routes.
- UI/UX:
  - Dùng `MatTable` + `MatPaginator` + `MatSort` khi có danh sách.
  - Thao tác tạo/sửa dùng `MatDialog`, validate tại form; thông báo bằng `MatSnackBar`.
  - Thêm route và item trong Sidebar để có thể điều hướng tới trang mới.

## 3) Quy trình chuẩn khi thêm TÍNH NĂNG MỚI

### 3.1 Backend (NestJS + Mongoose)
1) Tạo thư mục module dưới `backend/src/<feature>/` gồm: `schemas/`, `dto/`, `*.service.ts`, `*.controller.ts`, `*.module.ts`.
2) Schema:
   - Khai báo `@Schema({ timestamps: true })`.
   - Định nghĩa `required`, `unique`, `enum`, `default`, `index` theo nghiệp vụ.
   - Trường tham chiếu: `{ type: Types.ObjectId, ref: '<ModelName>' }`.
3) DTO:
   - `CreateXDto`: bắt buộc/khuyến nghị dùng `@IsString`, `@IsEnum`, `@IsBoolean`, `@IsNumber`, `@IsDateString`, `@IsOptional`, `@IsMongoId`, `@IsArray`...
   - `UpdateXDto extends PartialType(CreateXDto)`.
4) Service:
   - `create()`: ép các trường ngày/giờ từ ISO string -> `Date`.
   - `findAll()`: có thể `.lean()` và `.populate()` nếu cần.
   - `findOne()`/`update()`/`remove()`: trả `NotFoundException` nếu không tồn tại; bắt lỗi 11000 -> `BadRequestException`.
5) Controller: Map CRUD chuẩn `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.
6) Module: `MongooseModule.forFeature([{ name: Model.name, schema: ModelSchema }])`.
7) Đăng ký module mới trong `backend/src/app.module.ts`.

### 3.2 Frontend (Angular)
1) Service HTTP đặt ở `frontend/src/app/services/<feature>.service.ts` với `baseUrl = http://localhost:3000/<route>`.
2) Component trang danh sách `pages/<feature>/<feature>.component.ts`:
   - Bảng `MatTable` với các cột rõ ràng; có `MatPaginator` + `MatSort`.
   - Hành động `Thêm/Sửa/Xóa` dùng `MatDialog` + `MatMenu`.
   - SnackBar cho kết quả thao tác.
3) Dialog `pages/<feature>/<feature>-dialog.component.ts`:
   - Reactive Form, validators bám sát DTO backend.
   - Chuyển đổi `datetime-local` -> ISO string trước khi trả kết quả.
   - Với list nhiều lựa chọn, bắt đầu bằng input text; có thể nâng cấp lên select sau.
4) Wiring:
   - Khai báo component/dialog trong `app.module.ts`.
   - Thêm route trong `app-routing.module.ts`.
   - Thêm item trong `layout/sidebar/sidebar.component.ts`.

## 4) Checklist “Definition of Done” (DoD)
- Backend
  - [ ] Schema + DTO + Service + Controller + Module đầy đủ.
  - [ ] Đăng ký module trong `app.module.ts`.
  - [ ] Bắt lỗi 11000 (trùng khóa), trả message rõ ràng.
  - [ ] Các trường ngày/giờ được ép kiểu `Date` trước khi lưu.
  - [ ] `GET` trả dữ liệu không rò rỉ trường nhạy cảm (vd: mật khẩu).
- Frontend
  - [ ] Service gọi đúng endpoint.
  - [ ] Trang danh sách: hiển thị, sort, paginate (nếu cần), actions hoạt động.
  - [ ] Dialog: validate hợp lệ; lưu/sửa/xóa hoạt động và cập nhật bảng tại chỗ.
  - [ ] Thêm route + menu Sidebar.
- Chất lượng
  - [ ] Build Angular (development) thành công.
  - [ ] Backend khởi động, log mapping routes ok.
  - [ ] Smoke test 1-2 API (POST/GET) đạt.

## 5) Quy ước đặt tên & cấu trúc
- Collection/đường dẫn REST: số nhiều (e.g., `product-groups`, `fanpages`).
- Tên file TypeScript: kebab-case, đúng thư mục chức năng.
- Tên class: PascalCase; interface/type: PascalCase; biến/hàm: camelCase.
- Không thay đổi cấu trúc dự án trừ khi thực sự cần thiết và có ghi chú.

## 6) Xử lý lỗi & thông báo UI
- Duplicate key (11000): hiển thị SnackBar “Tên đã tồn tại” hoặc thông điệp tương đương.
- Not found: “Không tìm thấy <đối tượng>”.
- Lỗi mạng/CORS: Nhắc kiểm tra CORS (4200/4201), baseUrl, server đang chạy.

## 7) CORS, Port, và cấu hình
- CORS trong `backend/src/main.ts` đã allow `http://localhost:4200` và `http://localhost:4201`.
- Frontend chạy dev ở 4201 (`package.json`), Backend ở 3000.
- Không hardcode URL khác 3000/4201 khi dev.

## 8) Bảo mật & dữ liệu nhạy cảm
- Không log token ra console; nếu bắt buộc log để debug, che bớt (mask) phần lớn chuỗi.
- Không commit thông tin bí mật vào repo; dùng biến môi trường.

## 9) Ghi chú khi làm việc với trường tham chiếu
- Với các trường `connectedBy`, `defaultScriptGroupId`, `defaultProductGroupId`,…
  - Backend: kiểu `Types.ObjectId`, `@IsMongoId()` trong DTO.
  - Frontend: hiện tại nhập text id; có thể nâng cấp thành select sau khi có API danh sách tương ứng.

## 10) Nâng cấp dần (Progressive Enhancement)
- Bắt đầu với input cơ bản (string/number/boolean/date) để có CRUD hoàn chỉnh.
- Sau đó mới thêm phần nâng cao: chọn từ danh sách, chips, color picker, timezone selector, phân trang server, lọc nâng cao…

## 11) Cập nhật tài liệu tiến độ
- Khi hoàn thành tính năng mới, cập nhật `/.github/copilot-instructions.md` phần Features/Progress Tracking cho đồng bộ.

---

## Phụ lục A — Mẫu checklist khi thêm module mới

- Backend
  - [ ] `schemas/<name>.schema.ts`
  - [ ] `dto/create-<name>.dto.ts`, `dto/update-<name>.dto.ts`
  - [ ] `<name>.service.ts`, `<name>.controller.ts`, `<name>.module.ts`
  - [ ] Đăng ký `<Name>Module` trong `app.module.ts`
  - [ ] Test nhanh: POST tạo 1 bản ghi, GET danh sách

- Frontend
  - [ ] `services/<name>.service.ts`
  - [ ] `pages/<name>/<name>.component.ts`
  - [ ] `pages/<name>/<name>-dialog.component.ts`
  - [ ] Khai báo trong `app.module.ts`
  - [ ] Route trong `app-routing.module.ts`
  - [ ] Link menu trong Sidebar
  - [ ] Build dev thành công, CRUD chạy được

## Phụ lục B — Mẫu xử lý ngày/giờ
- Frontend: dùng `input[type=datetime-local]`, khi submit chuyển sang ISO: `new Date(value).toISOString()`.
- Backend Service: nếu DTO có chuỗi ISO, chuyển thành `new Date(dto.field)` trước khi lưu.

## Phụ lục C — Quy ước thông báo lỗi quen thuộc
- 11000: “Giá trị đã tồn tại (trùng)”.
- 400/422: “Dữ liệu không hợp lệ, vui lòng kiểm tra lại”.
- 404: “Không tìm thấy dữ liệu”.
- 500: “Có lỗi hệ thống, thử lại sau”.