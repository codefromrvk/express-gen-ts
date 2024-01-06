/**
 * Express router paths go here.
 */


export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Test: '/test',
    Status: '/status/:txnId',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
} as const;
