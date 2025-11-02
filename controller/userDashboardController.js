import mongoose from "mongoose";
import apponitment from "../model/apponitment.js";

export const getUserDashboardData = async (req, res) => {
    try {
        const { role, _id } = req.user;
        const { start_date, end_date } = req.query;
        
        let query = {};
        // Filter based on user role
        if (role === "patient") {
            query = { patientId: _id };
        } else if (role === "doctor") {
            query.doctorId = _id;
        } else if (role === "hospital") {
            query.hospitalId = _id;
        } else if (role === "staff") {
            query.hospitalId = req.user.hospitalId;
        }

        // Date filtering
        let dateFilter = {};
        if (start_date && end_date) {
            dateFilter.date = {
                $gte: start_date,
                $lte: end_date
            };
        }

        // Combine role query with date filter
        const finalQuery = { ...query, ...dateFilter };

        // Get today's date in "YYYY-MM-DD" format
        const today = new Date().toISOString().split('T')[0]; // Format: "2025-09-22"

        // Parallel API calls for better performance
        const [
            totalAppointments,
            todayAppointments,
            completedAppointments,
            checkInAppointments,
            confirmedAppointments,
            financialStats,
            statusRevenue
        ] = await Promise.all([
            // Total appointments count
            apponitment.countDocuments(finalQuery),

            // Today's appointments count - Match exact date string
            apponitment.countDocuments({
                ...query,
                date: today  // Exact match for today's date string
            }),

            // Completed appointments count
            apponitment.countDocuments({
                ...finalQuery,
                status: 'completed'
            }),

            // Check-in appointments count
            apponitment.countDocuments({
                ...finalQuery,
                status: 'check-in'
            }),

            // Confirmed appointments count
            apponitment.countDocuments({
                ...finalQuery,
                status: 'confirmed'
            }),

            // Total revenue
            apponitment.aggregate([
                { $match: finalQuery },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" }
                    }
                }
            ]),

            // Revenue by status
            apponitment.aggregate([
                { $match: finalQuery },
                {
                    $group: {
                        _id: "$status",
                        revenue: { $sum: "$amount" }
                    }
                }
            ])
        ]);

        // Extract revenue by status
        const revenueByStatus = {
            check_in: statusRevenue.find(s => s._id === 'check-in')?.revenue || 0,
            confirmed: statusRevenue.find(s => s._id === 'confirmed')?.revenue || 0,
            completed: statusRevenue.find(s => s._id === 'completed')?.revenue || 0
        };

        // Total revenue
        const totalRevenue = financialStats[0]?.totalRevenue || 0;

        // Prepare response data
        const dashboardData = {
            total_appointments: totalAppointments,
            today_appointments: todayAppointments,
            completed_appointments: completedAppointments,
            check_in_appointments: checkInAppointments,
            confirmed_appointments: confirmedAppointments,
            total_revenue: totalRevenue,
            revenue_by_status: revenueByStatus,
            today_date: today  // Include today's date in response
        };

        res.status(200).json({
            success: true,
            data: dashboardData,
            filters: {
                start_date: start_date || 'All time',
                end_date: end_date || 'All time',
                today_date: today
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};