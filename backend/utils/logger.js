// Logging utility for tracking actions
const logAction = async (action, performedBy = 'admin', supabase) => {
    try {
        const { error } = await supabase
            .from('logs')
            .insert([
                {
                    action: action,
                    performed_by: performedBy,
                    timestamp: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('Logging error:', error);
        }
    } catch (error) {
        console.error('Logging error:', error);
    }
};

module.exports = {
    logAction
};
