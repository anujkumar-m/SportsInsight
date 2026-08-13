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
  
    console.log('\n✅ Ready to serve requests\n');
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
