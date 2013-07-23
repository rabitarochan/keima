var mobgodbRoot = 'mongodb://localhost';
exports.mongodb = process.env.MONGO_URL || mobgodbRoot + '/keimadb';
exports.mubsub  = mobgodbRoot + 'keima-mubsub';
