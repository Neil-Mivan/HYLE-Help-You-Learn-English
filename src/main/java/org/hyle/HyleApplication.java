package org.hyle;

import java.io.IOException;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HyleApplication {
    public static void main(String[] args) throws IOException {
        Settings settings = Settings.load();
        SpringApplication app = new SpringApplication(HyleApplication.class);
        app.addInitializers(ctx -> ctx.getBeanFactory().registerSingleton("hyleSettings", settings));
        app.setDefaultProperties(Map.of(
            "server.address", settings.get("HOST", "127.0.0.1"),
            "server.port", settings.get("PORT", "4173"),
            "spring.web.resources.static-locations", "classpath:/static/",
            "server.shutdown", "immediate",
            "spring.main.banner-mode", "off"));
        app.run(args);
    }
}
