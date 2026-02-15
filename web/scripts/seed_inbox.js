const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('Seeding Inbox...');

    // 1. Get Org
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    if (!orgs || orgs.length === 0) { console.error('No Organization found'); return; }
    const orgId = orgs[0].id;

    // 2. Create Channel
    const { data: channel } = await supabase.from('channels').insert({
        organization_id: orgId,
        platform: 'whatsapp',
        provider_id: 'mock_whatsapp',
        credentials: {}
    }).select().single();

    // 3. Create Customers
    const customers = [
        { full_name: 'Awa Diop', phone: '+22177000001', tags: ['VIP', 'Mariage'] },
        { full_name: 'Jean Dubois', email: 'jean@example.com', tags: ['Lead'] },
        { full_name: 'Fatou Ndiaye', phone: '+22177000002', tags: [] }
    ];

    for (const c of customers) {
        const { data: customer } = await supabase.from('customers').insert({
            organization_id: orgId,
            ...c
        }).select().single();

        // 4. Create Conversation
        const { data: conv } = await supabase.from('conversations').insert({
            organization_id: orgId,
            customer_id: customer.id,
            channel_id: channel?.id,
            status: 'open',
            unread_count: Math.floor(Math.random() * 3),
            last_message_at: new Date().toISOString()
        }).select().single();

        // 5. Create Messages
        await supabase.from('messages').insert([
            {
                conversation_id: conv.id,
                sender_type: 'customer',
                content: `Bonjour, je voudrais des infos sur vos menus ${c.tags.includes('Mariage') ? 'Mariage' : 'Traiteur'}.`,
                created_at: new Date(Date.now() - 100000).toISOString()
            },
            {
                conversation_id: conv.id,
                sender_type: 'agent',
                content: 'Bonjour ! Bien sûr, voici nos offres.',
                created_at: new Date(Date.now() - 50000).toISOString()
            },
            {
                conversation_id: conv.id,
                sender_type: 'customer',
                content: 'Super, merci beaucoup !',
                created_at: new Date().toISOString()
            }
        ]);
    }

    console.log('✅ Seeding complete.');
}

seed();
