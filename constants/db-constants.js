'use strict';

const config = require('./../config');

/*
 * Related collection name with a database & schema
 */
module.exports = {
    dbSchema: {
        users: 'User',
        settings: 'Setting',
        languages: 'Language',
        language_labels: 'Language_label',
        cms: 'Cms',
        help_categories: 'Help_Category',
        helps: 'Help',
        sms_templates: 'Sms_template',
        contact_us: 'Contact_us',
        email_templates: 'Email_template',
        feedbacks: 'Feedback',
        push_templates: 'Push_template',
        roles: 'Role',
        screens: 'Screen',
        coupons: 'Coupon',
        customers: 'Customer',
        drivers: 'Driver',
        vehicles: 'Vehicle',
        prices: 'Price',
        modes: 'Mode',
        musics: 'Music',
        accessibles: 'Accessible',
        verify_mobiles:'Verify_mobile',
        trips:'Trip',
        notification_logs:'Notification_log',
        emergency_contacts:'Emergency_contact',
        transactions:'Transaction',
        makes:'Make',
        models:'Model',
        share_trips:'Share_trip',
        lost_items:'Lost_item',
        states:'State',
        cities:'City',
        years:'Year',
    }
};