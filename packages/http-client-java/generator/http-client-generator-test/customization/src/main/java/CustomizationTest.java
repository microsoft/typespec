import com.microsoft.typespec.http.client.generator.core.customization.ClassCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.PackageCustomization;
import org.slf4j.Logger;

import java.util.Arrays;

/**
 * This class contains the customization code to customize the AutoRest generated code for App Configuration.
 */
public class CustomizationTest extends Customization {

    @Override
    public void customize(LibraryCustomization customization, Logger logger) {
        logger.info("Customizing the NamingClient javadoc");
        PackageCustomization packageCustomization = customization.getPackage("com.cadl.naming");
        ClassCustomization classCustomization = packageCustomization.getClass("NamingClient");
        classCustomization.getMethod("postWithResponse")
                .getJavadoc()
                .setDescription("Protocol method for POST operation.");
    }
}
