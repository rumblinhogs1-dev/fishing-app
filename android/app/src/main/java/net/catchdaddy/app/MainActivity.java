package net.catchdaddy.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import android.webkit.WebView;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private int topDp = 0;
    private int bottomDp = 0;
    private boolean insetsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupWindowInsets();
        setupWebViewListener();
    }

    private void setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (v, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            topDp = Math.round(bars.top / density);
            bottomDp = Math.round(bars.bottom / density);
            insetsReady = true;
            injectSafeAreaInsets();
            return ViewCompat.onApplyWindowInsets(v, insets);
        });
    }

    private void setupWebViewListener() {
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                injectSafeAreaInsets();
            }
        });
    }

    private void injectSafeAreaInsets() {
        if (!insetsReady || getBridge() == null || getBridge().getWebView() == null) return;
        String js = String.format(Locale.US,
            "document.documentElement.style.setProperty('--sat','%dpx');" +
            "document.documentElement.style.setProperty('--sab','%dpx');",
            topDp, bottomDp
        );
        getBridge().executeOnMainThread(() ->
            getBridge().getWebView().evaluateJavascript(js, null)
        );
    }
}
