require('dotenv').config();
const { Project, User } = require('./models');

async function testCRUD() {
    try {
        console.log('--- Testing CRUD ---');
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            console.error('Admin user not found!');
            return;
        }

        console.log('Creating a project...');
        const project = await Project.create({
            name: 'Test Project',
            description: 'A project to test CRUD',
            ownerId: admin.id
        });
        console.log('✅ Project created:', project.toJSON());

        console.log('Updating project...');
        await project.update({ name: 'Updated Test Project' });
        console.log('✅ Project updated');

        console.log('Cleaning up (optional)...');
        // await project.destroy();
        // console.log('✅ Project deleted');

        console.log('--- CRUD Test Success ---');
    } catch (error) {
        console.error('❌ CRUD Test Failed:', error);
    } finally {
        process.exit();
    }
}

testCRUD();
