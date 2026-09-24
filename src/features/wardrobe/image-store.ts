// Metro selects image-store.native.ts or image-store.web.ts at runtime. This fallback
// gives TypeScript the same public contract while preserving platform resolution.
export * from './image-store.native';
