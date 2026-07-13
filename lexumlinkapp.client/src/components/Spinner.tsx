import { motion } from 'framer-motion';

export default function Spinner({ size = 40, color = '#8B7CF6' }) {
    return (
        <div className="flex justify-center items-center" style={{ minHeight: '200px' }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                    width: size,
                    height: size,
                    border: `4px solid ${color}20`,
                    borderTopColor: color,
                    borderRadius: '50%',
                }}
            />
        </div>
    );
}