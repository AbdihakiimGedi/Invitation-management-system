const db = require('./backend/src/config/database');
const EventModel = require('./backend/src/models/eventModel');

async function test() {
    try {
        const events = await EventModel.getAll();
        if (events.length === 0) {
            console.log('No events found');
            return;
        }
        const excludeId = events[0].id;
        console.log('Testing with excludeId:', excludeId);
        const available = await EventModel.getAvailableForTransfer(excludeId);
        console.log('Available for transfer:', available.length);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

test();
