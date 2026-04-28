export declare const userService: {
    getAllUsers(): Promise<{
        username: any;
        display_name: any;
        profile_picture: any;
        bio: any;
        is_online: any;
        last_seen: any;
    }[]>;
    upsertUser(data: {
        username: string;
        display_name?: string;
        profile_picture?: string;
        bio?: string;
    }): Promise<any>;
    getUserProfile(username: string): Promise<any>;
    getUserProfiles(usernames: string[]): Promise<any[]>;
    updateSettings(username: string, settings: {
        theme?: string;
        wallpaper?: string;
        notification_enabled?: boolean;
        sound_enabled?: boolean;
    }): Promise<any>;
    updateOnlineStatus(username: string, is_online: boolean): Promise<void>;
    searchUsers(query: string): Promise<{
        username: any;
        display_name: any;
        profile_picture: any;
        bio: any;
    }[]>;
};
