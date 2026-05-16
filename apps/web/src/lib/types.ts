export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'operator';
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};
