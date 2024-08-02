const mongoose = require('mongoose');
const Chance = require('chance');
const chance = new Chance();
const Organization = require('../organization/organization.model');
const Role = require('../user/role/role.model');
const User = require('./user.model');
const bcrypt = require('bcrypt');

// Connect to Mongo DB
const dbUrl = process.env.DB_URL || 'mongodb+srv://talhaarifqwertyexperts:11221122@smartjobseeker.shh1hlv.mongodb.net/?retryWrites=true&w=majority&appName=SmartJobSeeker';

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connection Successful');

    await seedDatabase();
  } catch (err) {
    console.error('Connection not successful', err);
  } finally {
    mongoose.disconnect();
  }
};

mongoose.Promise = global.Promise;

const seedDatabase = async () => {
  try {
    const user = {
      _id: new mongoose.Types.ObjectId(),
      email: 'talhaarif1437@gmail.com',
      type: 'SuperAdmin',
      role: '1',
      name: 'Talha Arif',
      password: await bcrypt.hash('Hello123$', 10)
    };

    await User.create(user);
    console.log('SuperAdmin seeded successfully',user);
    
  }
   catch (error) {
    console.error('Error:', error);
  }

};

const findOrganization = async () => {
  try {
    const orgExist = await Organization.findOne().sort({ _id: 1 });
    if (orgExist) {
      console.log('Organization found:', orgExist);
      return orgExist._id;
    } else {
      console.log('No organization found');
      return null;
    }
  } catch (error) {
    console.error('Error finding organization:', error);
    return null;
  }
};

const createRole = async (title) => {
  try {
    const roleData = {
      _id: new mongoose.Types.ObjectId(),
      title: title,
      deletedAt: null
    };
    const role = await Role.create(roleData);
    console.log('Role created is:', role);
    return role._id;
  } catch (err) {
    console.error('Error creating role:', err);
  }
};

const createUser = async (roleId) => {
  try {
    const plainPassword = 'Hello123$';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const user = {
      _id: new mongoose.Types.ObjectId(),
      email: chance.email(),
      type: 'Employee',
      jobRole: roleId,
      name: chance.name(),
      password: hashedPassword,
      avatar: 'default.png',
      organization: orgExist._id,
      createdBy: null,
      updatedBy: null,
      resetToken: null,
      resetTokenExpiration: null,
      isDeleted: false,
      deletedAt: null
    };

    console.log('Added User is:', user);

    await User.create(user);
    console.log('Users seeded successfully');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};

connectDB();
