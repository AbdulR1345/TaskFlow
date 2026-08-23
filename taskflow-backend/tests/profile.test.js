const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const authRoutes = require('../src/routes/authRoutes');

jest.setTimeout(20000);

describe('Profile updates', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow-test');
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('updates a profile name and password for an authenticated user', async () => {
    const user = await User.create({
      name: 'Abdul',
      email: 'abdul@example.com',
      password: '123456',
      isVerified: true
    });

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    const token = require('jsonwebtoken').sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret');

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Abdul Updated' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Abdul Updated');
  });
});
