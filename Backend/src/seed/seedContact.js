const { connectDB, disconnectDB } = require('../config/db');
const Settings = require('../models/Settings');

/**
 * Seed Contact Script (`npm run seed:contact`)
 * 
 * WHY:
 * Idempotently updates ONLY the owner contact details in the Settings singleton
 * without modifying payment methods, site name, guarantee days, or any other data.
 */
async function seedContact() {
  console.log('🌱 Updating owner contact information in Settings singleton...\n');
  await connectDB({ exitOnError: false });

  try {
    const contactData = {
      email: 'moaazelbedawy@gmail.com',
      whatsapp: '201095731606',
      phone: '+201095731606',
      location: {
        ar: '',
        en: '',
      },
      socials: {
        github: 'https://github.com/Elbedawy-dev',
        linkedin: 'https://www.linkedin.com/in/moaaz-elbedawy',
        twitter: '',
        facebook: '',
      },
    };

    const updated = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { contact: contactData } },
      { new: true, upsert: true }
    );

    console.log('✅ Contact information updated successfully in Settings document:');
    console.log(`   - Email: ${updated.contact.email}`);
    console.log(`   - WhatsApp: ${updated.contact.whatsapp}`);
    console.log(`   - Phone: ${updated.contact.phone}`);
    console.log(`   - LinkedIn: ${updated.contact.socials.linkedin}`);
    console.log(`   - GitHub: ${updated.contact.socials.github}`);
    console.log(`   - Location: ar="${updated.contact.location.ar}", en="${updated.contact.location.en}"`);
    console.log('\n⚠️  REMINDER: Please confirm that your GitHub profile URL is indeed https://github.com/Elbedawy-dev');
  } catch (error) {
    console.error('❌ Error updating contact information:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('\n🏁 Contact seed script finished.');
  }
}

if (require.main === module) {
  seedContact();
}

module.exports = seedContact;
