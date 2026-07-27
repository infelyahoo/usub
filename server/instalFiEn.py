import argostranslate.package
import argostranslate.translate

argostranslate.package.update_package_index()
available_packages = argostranslate.package.get_available_packages()

# Install Finnish -> English
package = next((p for p in available_packages if p.from_code == 'fi' and p.to_code == 'en'), None)
if package:
    print('Installing fi -> en ...')
    argostranslate.package.install_from_path(package.download())
    print('Installed successfully!')
else:
    print('Package fi->en not found in index.')