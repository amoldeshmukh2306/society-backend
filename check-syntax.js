try {
  require('./routes/payments');
  require('./routes/members');
  require('./utils/pdfGenerator');
  console.log('ok');
} catch (err) {
  console.error('module load error:', err && err.message ? err.message : err);
  process.exit(1);
}
