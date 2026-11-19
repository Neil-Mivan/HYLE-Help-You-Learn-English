package org.hyle;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;
import java.util.*;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@EnableScheduling
class PageSessions {
    private final Settings settings;
    private final ConfigurableApplicationContext application;
    private final Set<SseEmitter> pages = new HashSet<>();
    private long idleSince;
    private boolean visited, stopping;

    PageSessions(Settings settings, ConfigurableApplicationContext application) {
        this.settings = settings;
        this.application = application;
    }
    @EventListener(ApplicationReadyEvent.class)
    void ready() {
        idleSince = System.currentTimeMillis();
        if (!settings.enabled("CLEAR_READING_AUTO_OPEN")) return;
        String url = "http://127.0.0.1:" + application.getEnvironment().getProperty("local.server.port") + "/";
        try {
            String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
            if (os.contains("windows")) new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
            else if (os.contains("mac")) new ProcessBuilder("open", url).start();
            else if (Desktop.isDesktopSupported()) Desktop.getDesktop().browse(URI.create(url));
            else new ProcessBuilder("xdg-open", url).start();
        } catch (Exception e) { System.out.println("请用浏览器打开 " + url); }
    }
    @GetMapping("/api/session")
    synchronized ResponseEntity<SseEmitter> session() throws IOException {
        if (!settings.enabled("CLEAR_READING_AUTO_STOP")) return ResponseEntity.noContent().build();
        SseEmitter page = new SseEmitter(0L);
        pages.add(page);
        visited = true;
        page.onCompletion(() -> remove(page));
        page.onError(e -> remove(page));
        page.onTimeout(() -> remove(page));
        page.send(SseEmitter.event().name("ready").data("connected"));
        return ResponseEntity.ok().contentType(org.springframework.http.MediaType.TEXT_EVENT_STREAM).body(page);
    }
    private synchronized void remove(SseEmitter page) {
        if (pages.remove(page) && pages.isEmpty()) idleSince = System.currentTimeMillis();
    }
    @Scheduled(fixedDelay = 2000)
    synchronized void tick() {
        if (!settings.enabled("CLEAR_READING_AUTO_STOP") || idleSince == 0 || stopping) return;
        for (SseEmitter page : List.copyOf(pages)) {
            try { page.send(SseEmitter.event().comment("keep-alive")); }
            catch (IOException | IllegalStateException e) { remove(page); }
        }
        if (pages.isEmpty() && System.currentTimeMillis()-idleSince > (visited ? 7000 : 45000)) {
            stopping = true;
            new Thread(application::close, "hyle-shutdown").start();
        }
    }
}
