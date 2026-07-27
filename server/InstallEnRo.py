import argostranslate.package
import argostranslate.translate

argostranslate.package.update_package_index()
available_packages = argostranslate.package.get_available_packages()

# Install English -> Romanian
package = next((p for p in available_packages if p.from_code == 'en' and p.to_code == 'ro'), None)
if package:
    print('Installing en -> ro ...')
    argostranslate.package.install_from_path(package.download())
    print('Installed successfully!')
else:
    print('Package en->ro not found in index.')