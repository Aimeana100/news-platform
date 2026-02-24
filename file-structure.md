src/
│
├── main.ts
├── app.module.ts
│
├── config/
│   ├── configuration.ts
│   └── validation.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── common/
│   ├── constants/
│   │   └── roles.constant.ts
│   │
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   │
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts
│   │
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   │
│   ├── pipes/
│   │   └── validation.pipe.ts
│   │
│   └── utils/
│       ├── pagination.util.ts
│       └── date.util.ts
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── signup.dto.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   │
│   ├── articles/
│   │   ├── articles.module.ts
│   │   ├── articles.controller.ts
│   │   ├── articles.service.ts
│   │   ├── dto/
│   │   │   ├── create-article.dto.ts
│   │   │   ├── update-article.dto.ts
│   │   │   └── query-article.dto.ts
│   │   └── repositories/
│   │       └── articles.repository.ts
│   │
│   ├── read-log/
│   │   ├── read-log.module.ts
│   │   ├── read-log.service.ts
│   │   └── read-log.processor.ts   (using Bull)
│   │
│   └── analytics/
│       ├── analytics.module.ts
│       ├── analytics.service.ts
│       ├── analytics.job.ts
│       └── analytics.controller.ts (dashboard endpoint)
