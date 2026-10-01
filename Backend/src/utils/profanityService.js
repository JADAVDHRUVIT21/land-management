const PROFANITY_API_URL = process.env.PROFANITY_API_URL;

// Check message for abusive/profane content
export const checkProfanity = async (message) => {
    try {
        if (!PROFANITY_API_URL) {
            console.error(
                "PROFANITY_API_URL is not configured in .env"
            );

            return {
                success: false,
                isProfanity: true,
                error: true,
            };
        }

        const response = await fetch(
            PROFANITY_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    message: message,
                }),
            }
        );


        // API request failed
        if (!response.ok) {
            console.error(
                "Profanity API Error:",
                response.status,
                response.statusText
            );

            // Fail closed:
            // Don't allow message if moderation service fails.
            return {
                success: false,
                isProfanity: true,
                error: true,
            };
        }


        const data = await response.json();

        console.log(
            "Profanity API Response:",
            data
        );


        return {
            success: true,

            isProfanity:
                data.isProfanity === true,

            error: false,
        };

    } catch (error) {

        console.error(
            "PROFANITY API REQUEST ERROR:",
            error.message
        );

        // Don't allow message when API is unavailable
        return {
            success: false,
            isProfanity: true,
            error: true,
        };
    }
};