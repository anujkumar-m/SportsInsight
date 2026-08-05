require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test DB connection first
  await testConnection();

  app.listen(PORT, () => {
    console.log('\n🏅 ================================================');
    console.log('   Sports Academy Performance System API');
    console.log('   Integrated Athlete Monitoring System');
    console.log('🏅 ================================================');
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Base URL: http://localhost:${PORT}/api`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log('\n📡 Available API Endpoints:');
    console.log('   POST   /api/auth/login');
    console.log('   POST   /api/auth/logout');
    console.log('   POST   /api/auth/refresh-token');
    console.log('   POST   /api/auth/forgot-password');
    console.log('   POST   /api/auth/reset-password');
    console.log('   GET    /api/auth/profile');
    console.log('   GET    /api/dashboard/admin');
    console.log('   GET    /api/dashboard/coach');
    console.log('   GET    /api/dashboard/selector');
    console.log('   GET    /api/dashboard/athlete');
    console.log('   POST   /api/dashboard/ai/generate');
    console.log('   GET    /api/dashboard/ai/list-types');
    console.log('   GET    /api/dashboard/notifications');
    console.log('\n✅ Ready to serve requests\n');
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
