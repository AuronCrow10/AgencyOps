export function getPagination(input: { page: number; pageSize: number }) {
  const page = Number.isFinite(input.page) ? input.page : 1;
  const pageSize = Number.isFinite(input.pageSize) ? input.pageSize : 10;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}
